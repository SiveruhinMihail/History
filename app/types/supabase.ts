export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      category: {
        Row: {
          created_at: string | null;
          id: number;
          name: string | null;
          slug: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          name?: string | null;
          slug?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          name?: string | null;
          slug?: string | null;
        };
        Relationships: [];
      };
      comment_communities: {
        Row: {
          comment_id: number;
          community_id: number;
        };
        Insert: {
          comment_id: number;
          community_id: number;
        };
        Update: {
          comment_id?: number;
          community_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "comment_communities_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comment_communities_community_id_fkey";
            columns: ["community_id"];
            isOneToOne: false;
            referencedRelation: "community";
            referencedColumns: ["id"];
          },
        ];
      };
      comment_images: {
        Row: {
          comment_id: number;
          created_at: string | null;
          id: number;
          sort_order: number | null;
          url: string;
        };
        Insert: {
          comment_id: number;
          created_at?: string | null;
          id?: number;
          sort_order?: number | null;
          url: string;
        };
        Update: {
          comment_id?: number;
          created_at?: string | null;
          id?: number;
          sort_order?: number | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comment_images_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          created_at: string | null;
          id: number;
          likes_count: number | null;
          parent_id: number | null;
          post_id: number | null;
          text: string | null;
          user_id: number | null;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          likes_count?: number | null;
          parent_id?: number | null;
          post_id?: number | null;
          text?: string | null;
          user_id?: number | null;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          likes_count?: number | null;
          parent_id?: number | null;
          post_id?: number | null;
          text?: string | null;
          user_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "post";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      community: {
        Row: {
          avatar: string | null;
          created_at: string | null;
          description: string | null;
          id: number;
          name: string | null;
          owner_id: number | null;
          patent: boolean | null;
          rating: number;
        };
        Insert: {
          avatar?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: number;
          name?: string | null;
          owner_id?: number | null;
          patent?: boolean | null;
          rating?: number;
        };
        Update: {
          avatar?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: number;
          name?: string | null;
          owner_id?: number | null;
          patent?: boolean | null;
          rating?: number;
        };
        Relationships: [
          {
            foreignKeyName: "community_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      community_messages: {
        Row: {
          community_id: number;
          created_at: string | null;
          id: number;
          text: string;
          user_id: number;
        };
        Insert: {
          community_id: number;
          created_at?: string | null;
          id?: number;
          text: string;
          user_id: number;
        };
        Update: {
          community_id?: number;
          created_at?: string | null;
          id?: number;
          text?: string;
          user_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "community_messages_community_id_fkey";
            columns: ["community_id"];
            isOneToOne: false;
            referencedRelation: "community";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      favorites: {
        Row: {
          created_at: string;
          id: number;
          post_id: number;
          user_id: number;
        };
        Insert: {
          created_at?: string;
          id?: number;
          post_id: number;
          user_id: number;
        };
        Update: {
          created_at?: string;
          id?: number;
          post_id?: number;
          user_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "post";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      like_to_comment: {
        Row: {
          comment_id: number;
          created_at: string | null;
          user_id: number;
        };
        Insert: {
          comment_id: number;
          created_at?: string | null;
          user_id: number;
        };
        Update: {
          comment_id?: number;
          created_at?: string | null;
          user_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "like_to_comment_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "like_to_comment_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      like_to_post: {
        Row: {
          created_at: string | null;
          post_id: number;
          user_id: number;
        };
        Insert: {
          created_at?: string | null;
          post_id: number;
          user_id: number;
        };
        Update: {
          created_at?: string | null;
          post_id?: number;
          user_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "like_to_post_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "post";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "like_to_post_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      message: {
        Row: {
          community_id: number | null;
          created_at: string | null;
          id: number;
          text: string | null;
          user_id: number | null;
        };
        Insert: {
          community_id?: number | null;
          created_at?: string | null;
          id?: number;
          text?: string | null;
          user_id?: number | null;
        };
        Update: {
          community_id?: number | null;
          created_at?: string | null;
          id?: number;
          text?: string | null;
          user_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_message_community";
            columns: ["community_id"];
            isOneToOne: false;
            referencedRelation: "community";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "message_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      post: {
        Row: {
          author_id: number | null;
          created_at: string | null;
          description: string | null;
          id: number;
          image: string | null;
          moderation_status: string | null;
          rating: number | null;
          status: string | null;
          title: string | null;
        };
        Insert: {
          author_id?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: number;
          image?: string | null;
          moderation_status?: string | null;
          rating?: number | null;
          status?: string | null;
          title?: string | null;
        };
        Update: {
          author_id?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: number;
          image?: string | null;
          moderation_status?: string | null;
          rating?: number | null;
          status?: string | null;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "post_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      post_categories: {
        Row: {
          category_id: number;
          created_at: string | null;
          post_id: number;
        };
        Insert: {
          category_id: number;
          created_at?: string | null;
          post_id: number;
        };
        Update: {
          category_id?: number;
          created_at?: string | null;
          post_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "post_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "category";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_categories_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "post";
            referencedColumns: ["id"];
          },
        ];
      };
      post_images: {
        Row: {
          created_at: string | null;
          id: number;
          post_id: number;
          sort_order: number | null;
          url: string;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          post_id: number;
          sort_order?: number | null;
          url: string;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          post_id?: number;
          sort_order?: number | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_images_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "post";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          created_at: string | null;
          id: number;
          reason: string | null;
          reporter_id: number | null;
          status: string | null;
          target_id: number;
          target_type: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          reason?: string | null;
          reporter_id?: number | null;
          status?: string | null;
          target_id: number;
          target_type?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          reason?: string | null;
          reporter_id?: number | null;
          status?: string | null;
          target_id?: number;
          target_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      subscribers: {
        Row: {
          communities_id: number;
          created_at: string | null;
          role: string | null;
          user_id: number;
        };
        Insert: {
          communities_id: number;
          created_at?: string | null;
          role?: string | null;
          user_id: number;
        };
        Update: {
          communities_id?: number;
          created_at?: string | null;
          role?: string | null;
          user_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "subscribers_communities_id_fkey";
            columns: ["communities_id"];
            isOneToOne: false;
            referencedRelation: "community";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscribers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      trigger_log: {
        Row: {
          comment_id: number | null;
          created_at: string | null;
          function_name: string | null;
          id: number;
          message: string | null;
          user_id: number | null;
        };
        Insert: {
          comment_id?: number | null;
          created_at?: string | null;
          function_name?: string | null;
          id?: number;
          message?: string | null;
          user_id?: number | null;
        };
        Update: {
          comment_id?: number | null;
          created_at?: string | null;
          function_name?: string | null;
          id?: number;
          message?: string | null;
          user_id?: number | null;
        };
        Relationships: [];
      };
      user: {
        Row: {
          auth_uid: string;
          avatar: string | null;
          created_at: string | null;
          description: string | null;
          email: string | null;
          gender: boolean | null;
          id: number;
          is_banned: boolean | null;
          level: number | null;
          password: string | null;
          phone: string | null;
          rating: number | null;
          role: string | null;
          status: string | null;
          updated_at: string | null;
          use: string | null;
          username: string | null;
        };
        Insert: {
          auth_uid: string;
          avatar?: string | null;
          created_at?: string | null;
          description?: string | null;
          email?: string | null;
          gender?: boolean | null;
          id?: number;
          is_banned?: boolean | null;
          level?: number | null;
          password?: string | null;
          phone?: string | null;
          rating?: number | null;
          role?: string | null;
          status?: string | null;
          updated_at?: string | null;
          use?: string | null;
          username?: string | null;
        };
        Update: {
          auth_uid?: string;
          avatar?: string | null;
          created_at?: string | null;
          description?: string | null;
          email?: string | null;
          gender?: boolean | null;
          id?: number;
          is_banned?: boolean | null;
          level?: number | null;
          password?: string | null;
          phone?: string | null;
          rating?: number | null;
          role?: string | null;
          status?: string | null;
          updated_at?: string | null;
          use?: string | null;
          username?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
